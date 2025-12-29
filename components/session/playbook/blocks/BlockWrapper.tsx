'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown, ChevronRight, GripVertical,
  MoreHorizontal, Trash2, Copy, Play, CheckCircle, SkipForward,
  Edit2, Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BlockWrapperProps {
  id: string;
  type: 'scene' | 'encounter' | 'quest' | 'info';
  title: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
  isEditing: boolean;
  onToggleEdit: () => void;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRun?: () => void;
  isRunnable?: boolean;
}

const STATUS_STYLES = {
  pending: 'border-slate-700 bg-slate-900',
  active: 'border-teal-500 bg-teal-950/30 ring-1 ring-teal-500/50',
  completed: 'border-green-700 bg-green-950/20 opacity-75',
  skipped: 'border-slate-700 bg-slate-900 opacity-50',
};

const STATUS_BADGES: Record<string, React.ReactNode> = {
  pending: null,
  active: <Badge className="bg-teal-600 text-xs">Active</Badge>,
  completed: <Badge className="bg-green-700 text-xs">Complete</Badge>,
  skipped: <Badge variant="outline" className="border-slate-600 text-slate-500 text-xs">Skipped</Badge>,
};

export function BlockWrapper({
  id,
  title,
  status,
  icon,
  color,
  children,
  isEditing,
  onToggleEdit,
  onStatusChange,
  onDelete,
  onDuplicate,
  onRun,
  isRunnable = false,
}: BlockWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(status === 'active' || isEditing);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Auto-expand when editing
  const handleToggleEdit = () => {
    if (!isEditing) {
      setIsExpanded(true);
    }
    onToggleEdit();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-playbook-block
      className={`rounded-lg border transition-all ${STATUS_STYLES[status]} ${isEditing ? 'ring-2 ring-blue-500/50' : ''}`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 p-3 cursor-pointer"
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-slate-800 rounded cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-slate-500" />
        </button>

        {/* Expand/Collapse */}
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}

        {/* Icon */}
        <div className={`p-1.5 rounded ${color}`}>
          {icon}
        </div>

        {/* Title */}
        <span className="font-medium text-white flex-1 truncate">
          {title || 'Untitled Block'}
        </span>

        {/* Status Badge */}
        {STATUS_BADGES[status]}

        {/* Editing Badge */}
        {isEditing && (
          <Badge className="bg-blue-600 text-xs">Editing</Badge>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Edit Toggle */}
          <Button
            size="sm"
            variant="ghost"
            className={`h-8 w-8 p-0 ${isEditing ? 'text-green-400 hover:text-green-300' : 'text-slate-400 hover:text-slate-300'}`}
            onClick={handleToggleEdit}
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </Button>

          {/* Run Button */}
          {isRunnable && status !== 'completed' && !isEditing && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-teal-400 hover:text-teal-300 hover:bg-teal-900/30"
              onClick={onRun}
            >
              <Play className="w-4 h-4 mr-1" />
              Run
            </Button>
          )}

          {/* Quick Complete */}
          {status === 'active' && !isEditing && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-green-400 hover:text-green-300 hover:bg-green-900/30"
              onClick={() => onStatusChange('completed')}
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}

          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
              {status !== 'active' && (
                <DropdownMenuItem onClick={() => onStatusChange('active')}>
                  <Play className="w-4 h-4 mr-2" />
                  Set Active
                </DropdownMenuItem>
              )}
              {status !== 'completed' && (
                <DropdownMenuItem onClick={() => onStatusChange('completed')}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
              )}
              {status !== 'skipped' && (
                <DropdownMenuItem onClick={() => onStatusChange('skipped')}>
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip
                </DropdownMenuItem>
              )}
              {status !== 'pending' && (
                <DropdownMenuItem onClick={() => onStatusChange('pending')}>
                  Reset to Pending
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-400 focus:text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-800">
          {children}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete this block?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently remove &quot;{title || 'Untitled Block'}&quot; from your session prep. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
