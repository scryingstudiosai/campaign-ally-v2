'use client';

import { useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditEntityShellProps {
  entity: {
    id: string;
    name: string;
    entity_type: string;
    sub_type?: string;
  };
  campaignId: string;
  title?: string;
  children: ReactNode;
  onSave: () => Promise<void>;
  hasChanges?: boolean;
  setHasChanges?: (value: boolean) => void;
}

export function EditEntityShell({
  entity,
  campaignId,
  title,
  children,
  onSave,
  hasChanges: externalHasChanges,
  setHasChanges: externalSetHasChanges,
}: EditEntityShellProps): JSX.Element {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [internalHasChanges, setInternalHasChanges] = useState(false);

  // Use external state if provided, otherwise use internal
  const hasChanges = externalHasChanges ?? internalHasChanges;
  const setHasChanges = externalSetHasChanges ?? setInternalHasChanges;

  const handleSave = async (): Promise<void> => {
    if (isSaving) {
      console.log('[EditShell] Already saving, ignoring click');
      return;
    }

    setIsSaving(true);
    console.log('[EditShell] Starting save...');

    try {
      await onSave();
      console.log('[EditShell] Save completed successfully');
      setHasChanges(false);
      toast.success('Changes saved!');

      // Small delay to ensure toast shows before navigation
      setTimeout(() => {
        router.push(`/dashboard/campaigns/${campaignId}/memory/${entity.id}`);
        router.refresh(); // Force refresh to show new data
      }, 500);
    } catch (error) {
      console.error('[EditShell] Save failed:', error);
      toast.error('Failed to save changes. Please try again.');
      setIsSaving(false); // Only reset on error so user can retry
    }
  };

  const handleCancel = (): void => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    router.push(`/dashboard/campaigns/${campaignId}/memory/${entity.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
            className="text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              {title || `Edit ${entity.name}`}
            </h1>
            <p className="text-sm text-slate-500 capitalize">
              {entity.entity_type} • {entity.sub_type || 'No subtype'}
            </p>
          </div>
        </div>

        {isSaving ? (
          <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-1 rounded animate-pulse">
            Saving changes...
          </span>
        ) : hasChanges ? (
          <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-1 rounded">
            Unsaved changes
          </span>
        ) : null}
      </div>

      {/* Form Content */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        {children}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-teal-600 hover:bg-teal-700 min-w-[120px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
