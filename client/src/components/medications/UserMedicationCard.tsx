import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PillIcon, Calendar, Clock, XCircle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface MedicationInfo {
  id: number;
  name: string;
  genericName: string | null;
  brandName: string | null;
  dosage: string | null;
  imageUrl: string | null;
  category: string | null;
}

interface UserMedicationCardProps {
  id: number;
  medicationId: number;
  startDate: string;
  endDate: string | null;
  dosage: string | null;
  frequency: string | null;
  instructions: string | null;
  notes: string | null;
  active: boolean;
  source: string;
  medication: MedicationInfo | null;
  onToggleActive?: (id: number, active: boolean) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const UserMedicationCard: React.FC<UserMedicationCardProps> = ({
  id,
  startDate,
  endDate,
  dosage,
  frequency,
  instructions,
  notes,
  active,
  source,
  medication,
  onToggleActive,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation();
  
  // Format dates
  const startDateFormatted = new Date(startDate).toLocaleDateString();
  const endDateFormatted = endDate ? new Date(endDate).toLocaleDateString() : null;
  
  // Get time since started
  const timeSinceStart = formatDistanceToNow(new Date(startDate), { addSuffix: true });
  
  // Get source badge color
  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'prescription':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'order':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };
  
  // Get source label
  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'prescription':
        return t('Prescription');
      case 'order':
        return t('Order');
      default:
        return t('Manual Entry');
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">
              {medication?.name || t('Unknown Medication')}
            </CardTitle>
            {medication?.genericName && (
              <CardDescription>
                {medication.genericName} {medication.brandName ? `(${medication.brandName})` : ''}
              </CardDescription>
            )}
          </div>
          <Badge 
            className={`${getSourceBadgeColor(source)} font-medium text-white`}
          >
            {getSourceLabel(source)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-1">
        {(dosage || medication?.dosage) && (
          <div className="flex items-center text-sm">
            <PillIcon className="h-4 w-4 mr-2 text-primary/70" />
            <span className="text-gray-700 dark:text-gray-300">
              {t('Dosage')}: {dosage || medication?.dosage}
            </span>
          </div>
        )}
        
        {frequency && (
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-primary/70" />
            <span className="text-gray-700 dark:text-gray-300">
              {t('Frequency')}: {frequency}
            </span>
          </div>
        )}
        
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-2 text-primary/70" />
          <span className="text-gray-700 dark:text-gray-300">
            {t('Started')}: {startDateFormatted} ({timeSinceStart})
          </span>
        </div>
        
        {endDateFormatted && (
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-primary/70" />
            <span className="text-gray-700 dark:text-gray-300">
              {t('Ends')}: {endDateFormatted}
            </span>
          </div>
        )}
        
        {instructions && (
          <div className="mt-2 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="font-medium text-gray-700 dark:text-gray-300">{t('Instructions')}:</p>
            <p className="text-gray-600 dark:text-gray-400">{instructions}</p>
          </div>
        )}
        
        {notes && (
          <div className="mt-2 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="font-medium text-gray-700 dark:text-gray-300">{t('Notes')}:</p>
            <p className="text-gray-600 dark:text-gray-400">{notes}</p>
          </div>
        )}
        
        <div className="flex items-center mt-2">
          <Badge 
            className={active 
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
            }
          >
            {active ? (
              <><CheckCircle2 className="h-3 w-3 mr-1" /> {t('Active')}</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" /> {t('Inactive')}</>
            )}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between bg-gray-50 dark:bg-gray-800">
        {onToggleActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleActive(id, !active)}
          >
            {active ? t('Mark Inactive') : t('Mark Active')}
          </Button>
        )}
        
        <div className="flex space-x-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(id)}
            >
              {t('Edit')}
            </Button>
          )}
          
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(id)}
            >
              {t('Delete')}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default UserMedicationCard;