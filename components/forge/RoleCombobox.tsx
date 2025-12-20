'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const COMMON_ROLES = [
  // Common NPCs
  { value: 'guard', label: 'Guard' },
  { value: 'shopkeeper', label: 'Shopkeeper' },
  { value: 'innkeeper', label: 'Innkeeper' },
  { value: 'blacksmith', label: 'Blacksmith' },
  { value: 'merchant', label: 'Merchant' },
  { value: 'noble', label: 'Noble' },
  { value: 'priest', label: 'Priest' },
  { value: 'scholar', label: 'Scholar' },
  { value: 'farmer', label: 'Farmer' },
  { value: 'sailor', label: 'Sailor' },
  // Adventure-related
  { value: 'adventurer', label: 'Adventurer' },
  { value: 'mercenary', label: 'Mercenary' },
  { value: 'bounty hunter', label: 'Bounty Hunter' },
  { value: 'assassin', label: 'Assassin' },
  { value: 'spy', label: 'Spy' },
  // Magic users
  { value: 'wizard', label: 'Wizard' },
  { value: 'alchemist', label: 'Alchemist' },
  { value: 'herbalist', label: 'Herbalist' },
  { value: 'fortune teller', label: 'Fortune Teller' },
  // Underworld
  { value: 'thief', label: 'Thief' },
  { value: 'smuggler', label: 'Smuggler' },
  { value: 'fence', label: 'Fence' },
  { value: 'crime boss', label: 'Crime Boss' },
  // Performers
  { value: 'bard', label: 'Bard' },
  { value: 'entertainer', label: 'Entertainer' },
  { value: 'street performer', label: 'Street Performer' },
  // Service
  { value: 'servant', label: 'Servant' },
  { value: 'cook', label: 'Cook' },
  { value: 'stablehand', label: 'Stablehand' },
  { value: 'courier', label: 'Courier' },
]

interface RoleComboboxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RoleCombobox({
  value,
  onChange,
  placeholder = 'Select or type a role...',
}: RoleComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)

  // Update input when value prop changes
  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue)
    setInputValue(selectedValue)
    setOpen(false)
  }

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    onChange(newValue)
  }

  // Filter roles based on input
  const filteredRoles = COMMON_ROLES.filter((role) =>
    role.label.toLowerCase().includes(inputValue.toLowerCase())
  )

  // Check if current input is a custom value (not in list)
  const isCustomValue =
    inputValue &&
    !COMMON_ROLES.some(
      (role) => role.label.toLowerCase() === inputValue.toLowerCase()
    )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-slate-900/50 border-slate-700 hover:bg-slate-800/50"
        >
          <span className={cn(!value && 'text-slate-500')}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or type custom role..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue ? (
                <div
                  className="p-2 text-sm cursor-pointer hover:bg-slate-800 rounded"
                  onClick={() => handleSelect(inputValue)}
                >
                  Create &quot;<span className="text-primary">{inputValue}</span>
                  &quot;
                </div>
              ) : (
                'No roles found.'
              )}
            </CommandEmpty>
            <CommandGroup heading="Common Roles">
              {filteredRoles.map((role) => (
                <CommandItem
                  key={role.value}
                  value={role.value}
                  onSelect={() => handleSelect(role.label)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value?.toLowerCase() === role.label.toLowerCase()
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {role.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {isCustomValue && (
              <CommandGroup heading="Custom">
                <CommandItem
                  value={inputValue}
                  onSelect={() => handleSelect(inputValue)}
                >
                  <Check className="mr-2 h-4 w-4 opacity-100" />
                  {inputValue}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
