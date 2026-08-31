import React from 'react';
import EmergencyFlow from '../EmergencyFlow';

interface EmergencyEntryProps {
  isOpen: boolean;
  onClose: () => void;
  savedFacilityName?: string;
  savedFacilityPhone?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
}

// Compatibility wrapper: all Emergency entry points now render the same canonical
// EmergencyFlow. Legacy props are intentionally ignored so there is only one flow.
export const EmergencyEntry: React.FC<EmergencyEntryProps> = ({ isOpen, onClose }) =>
  isOpen ? <EmergencyFlow onClose={onClose} /> : null;

export default EmergencyEntry;
