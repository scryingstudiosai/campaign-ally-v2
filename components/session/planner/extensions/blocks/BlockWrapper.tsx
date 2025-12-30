'use client'

import { useState, ReactNode } from 'react'
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  MoreHorizontal,
  Trash2,
  Copy,
  Play,
  CheckCircle,
  SkipForward,
} from 'lucide-react'
import { BlockStatus, STATUS_STYLES, STATUS_BADGES } from './shared'

interface BlockWrapperProps {
  node: NodeViewProps['node']
  updateAttributes: NodeViewProps['updateAttributes']
  deleteNode: NodeViewProps['deleteNode']
  editor: NodeViewProps['editor']
  icon: ReactNode
  iconBgColor: string
  title: string
  onTitleChange?: (title: string) => void
  metadataBar?: ReactNode
  isRunnable?: boolean
  onRun?: () => void
  children?: ReactNode
}

export function BlockWrapper({
  node,
  updateAttributes,
  deleteNode,
  editor,
  icon,
  iconBgColor,
  title,
  onTitleChange,
  metadataBar,
  isRunnable = false,
  onRun,
  children,
}: BlockWrapperProps) {
  const status = (node.attrs.status as BlockStatus) || 'pending'
  const isCollapsed = node.attrs.isCollapsed as boolean
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(title)

  // Update status without adding to undo history
  const updateStatus = (newStatus: BlockStatus) => {
    if (!editor || !editor.isEditable) {
      console.warn('Editor not ready for status change')
      return
    }

    try {
      // Use updateAttributes directly - it's safer and handles the node position correctly
      updateAttributes({ status: newStatus })
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const toggleCollapse = () => {
    if (!editor || !editor.isEditable) return
    updateAttributes({ isCollapsed: !isCollapsed })
  }

  const handleTitleSubmit = () => {
    if (onTitleChange && editedTitle !== title) {
      onTitleChange(editedTitle)
    }
    setIsEditingTitle(false)
  }

  const handleDuplicate = () => {
    // Get current node's JSON and insert a copy after it
    const nodeJson = node.toJSON()
    nodeJson.attrs = { ...nodeJson.attrs, id: crypto.randomUUID() }

    editor.commands.command(({ tr, dispatch }) => {
      if (dispatch) {
        const pos = editor.state.selection.to
        tr.insert(pos, editor.schema.nodeFromJSON(nodeJson))
      }
      return true
    })
  }

  return (
    <NodeViewWrapper
      className={`my-3 rounded-lg border transition-all ${STATUS_STYLES[status]}`}
      data-block-status={status}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3">
        {/* Drag Handle */}
        <div
          data-drag-handle
          className="p-1 hover:bg-slate-800 rounded cursor-grab active:cursor-grabbing"
          contentEditable={false}
        >
          <GripVertical className="w-4 h-4 text-slate-500" />
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={toggleCollapse}
          className="p-1 hover:bg-slate-800 rounded"
          contentEditable={false}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Icon */}
        <div className={`p-1.5 rounded ${iconBgColor}`} contentEditable={false}>
          {icon}
        </div>

        {/* Title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit()
              if (e.key === 'Escape') {
                setEditedTitle(title)
                setIsEditingTitle(false)
              }
            }}
            className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
            autoFocus
          />
        ) : (
          <span
            className="font-medium text-white flex-1 truncate cursor-text"
            onClick={() => {
              setEditedTitle(title)
              setIsEditingTitle(true)
            }}
            contentEditable={false}
          >
            {title || 'Untitled Block'}
          </span>
        )}

        {/* Status Badge */}
        <span contentEditable={false}>{STATUS_BADGES[status]}</span>

        {/* Actions */}
        <div className="flex items-center gap-1" contentEditable={false}>
          {/* Run Button */}
          {isRunnable && status !== 'completed' && (
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

          {/* Quick Complete (when active) */}
          {status === 'active' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/30"
              onClick={() => updateStatus('completed')}
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
                <DropdownMenuItem onClick={() => updateStatus('active')}>
                  <Play className="w-4 h-4 mr-2" />
                  Set Active
                </DropdownMenuItem>
              )}
              {status !== 'completed' && (
                <DropdownMenuItem onClick={() => updateStatus('completed')}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
              )}
              {status !== 'skipped' && (
                <DropdownMenuItem onClick={() => updateStatus('skipped')}>
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip
                </DropdownMenuItem>
              )}
              {status !== 'pending' && (
                <DropdownMenuItem onClick={() => updateStatus('pending')}>
                  Reset to Pending
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem onClick={handleDuplicate}>
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

      {/* Metadata Bar (optional) */}
      {!isCollapsed && metadataBar && (
        <div className="px-4 py-2 border-t border-slate-800 flex flex-wrap gap-4 text-sm" contentEditable={false}>
          {metadataBar}
        </div>
      )}

      {/* Custom content (for block-specific UI like creature lists) */}
      {!isCollapsed && children && (
        <div className="px-4 py-3 border-t border-slate-800" contentEditable={false}>
          {children}
        </div>
      )}

      {/* Rich Text Content */}
      {!isCollapsed && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-800">
          <NodeViewContent className="prose prose-invert prose-sm max-w-none focus:outline-none min-h-[60px]" />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete this block?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently remove &quot;{title || 'Untitled Block'}&quot; and all its content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteNode()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NodeViewWrapper>
  )
}
