type QunoApiBookingSlot = {
  start: string;
  end: string;
  selectable?: boolean;
  canonicalReservation?: {
    doctorId: string;
    clinicResourceIds: readonly string[];
    physicalLocationId: string | null;
    packageId?: string;
    upsellPackageId?: string;
    authorizedInviteSalesforceId?: string;
  };
};

/** Returns the fresh authorized slot only when all booking identities still match. */
export function matchBookingSelection<TSlot extends QunoApiBookingSlot>({
  selected,
  slots
}: {
  selected: TSlot;
  slots: readonly TSlot[];
}): TSlot | undefined {
  const previous = selected.canonicalReservation;
  if (!previous) {
    return undefined;
  }
  const resources = [...previous.clinicResourceIds].sort();
  return slots.find((slot) => {
    const current = slot.canonicalReservation;
    return (
      slot.selectable !== false &&
      current !== undefined &&
      Date.parse(slot.start) === Date.parse(selected.start) &&
      Date.parse(slot.end) === Date.parse(selected.end) &&
      current.doctorId === previous.doctorId &&
      current.physicalLocationId === previous.physicalLocationId &&
      current.packageId === previous.packageId &&
      current.upsellPackageId === previous.upsellPackageId &&
      current.authorizedInviteSalesforceId === previous.authorizedInviteSalesforceId &&
      current.clinicResourceIds.length === previous.clinicResourceIds.length &&
      [...current.clinicResourceIds].sort().every((id, index) => id === resources[index])
    );
  });
}
