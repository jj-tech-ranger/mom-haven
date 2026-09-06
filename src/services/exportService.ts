import { auth } from '../lib/firebase';

/**
 * Downloads the official MOH 216 Child Immunization Certificate PDF.
 */
export async function downloadImmunizationCertificate(childId: string, childName?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Authentication required to export clinical records.');
  }

  const token = await user.getIdToken();
  const response = await fetch(`/api/v1/export/immunization-certificate/${childId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error || 'Failed to generate immunization certificate PDF.');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  const safeName = (childName || 'Child').replace(/[^a-zA-Z0-9_-]/g, '_');
  anchor.download = `${safeName}_MOH216_Immunization_Certificate.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(anchor);
}
