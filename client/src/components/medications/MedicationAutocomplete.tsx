import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTranslation } from 'react-i18next';
import { Medication } from '@shared/schema';

interface MedicationAutocompleteProps {
  medications: Medication[];
  onSelect: (medication: Medication) => void;
  defaultSelectedId?: number;
  disabled?: boolean;
}

export default function MedicationAutocomplete({
  medications,
  onSelect,
  defaultSelectedId,
  disabled = false,
}: MedicationAutocompleteProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);

  // Set initial selection if defaultSelectedId is provided
  useEffect(() => {
    if (defaultSelectedId && medications.length > 0) {
      const medication = medications.find(m => m.id === defaultSelectedId);
      if (medication) {
        setSelectedMedication(medication);
      }
    }
  }, [defaultSelectedId, medications]);

  const handleSelect = (medication: Medication) => {
    setSelectedMedication(medication);
    setOpen(false);
    onSelect(medication);
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedMedication && "text-muted-foreground",
            disabled && "opacity-70 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          {selectedMedication
            ? `${selectedMedication.name} ${selectedMedication.dosage ? '- ' + selectedMedication.dosage : ''}`
            : t('Select a medication')}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={t('Search medications...')} />
          <CommandEmpty>{t('No medication found.')}</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {medications.map((medication) => (
              <CommandItem
                key={medication.id}
                value={`${medication.name}-${medication.id}`}
                onSelect={() => handleSelect(medication)}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedMedication?.id === medication.id
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{medication.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {medication.dosage && `${medication.dosage}`}
                    {medication.genericName && ` - ${medication.genericName}`}
                    {medication.brandName && ` (${medication.brandName})`}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}