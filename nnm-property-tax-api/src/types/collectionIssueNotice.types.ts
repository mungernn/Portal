import type { CollectionIssueType } from "./collectionIssue.types";

export interface CollectionIssueNoticeTemplate {
  /** Short label used on the notice itself, e.g. "NOTICE OF DEMAND AND WARNING OF COERCIVE RECOVERY". */
  title: string;
  /** The statutory provisions this notice is issued under - shown on the notice as its legal basis. */
  legalBasis: string;
  /**
   * The operative body text of the notice. {ownerName}, {holdingNo},
   * {address}, {ward}, {demandNo}, {totalAmountDemanded}, {issueNotes},
   * {reportedDate}, {complianceDays} are substituted at generation time
   * - see collectionIssueNotice.service.ts.
   */
  body: string;
  /** Number of days given to respond/comply before the next enforcement step, stated on the notice. */
  complianceDays: number;
}

/**
 * Six standard notice formats, one per collection_issues type (migration
 * 079), grounded in the Bihar Municipal Act, 2007 and the Bihar Property
 * Tax (Assessment, Collection and Recovery) Rules, 2013. These are
 * starting templates for the Municipality's own legal/law officer to
 * review and adapt to local practice before first use - see the
 * disclaimer rendered on every notice (collection-issue-notice.tsx).
 */
export const COLLECTION_ISSUE_NOTICE_TEMPLATES: Record<CollectionIssueType, CollectionIssueNoticeTemplate> = {
  refused_to_pay: {
    title: "Notice of Demand and Warning of Coercive Recovery",
    legalBasis:
      "Section 127 and Section 158 of the Bihar Municipal Act, 2007, read with the Bihar Property Tax (Assessment, Collection and Recovery) Rules, 2013",
    body:
      "Whereas Property Tax amounting to Rs. {totalAmountDemanded}/- stands due and payable in respect of Holding No. {holdingNo} " +
      "situated at {address}, Ward No. {ward}, in the name of {ownerName}, as per Demand Notice No. {demandNo} attached herewith; " +
      "\n\nAnd whereas on {reportedDate} the Tax Collector of this Municipality visited the said holding for collection of the above dues " +
      "and it is reported that {ownerName} refused to make payment of the amount demanded; " +
      "\n\nNow, therefore, {ownerName} is hereby called upon to pay the entire outstanding amount of Rs. {totalAmountDemanded}/- to the " +
      "Municipality within {complianceDays} days of the date of this notice, failing which the Municipality shall, without further notice, " +
      "proceed to recover the said amount as an arrear of tax by any or all of the following modes as provided under Section 158 of the " +
      "Bihar Municipal Act, 2007: issue of a warrant for attachment, distress and sale of movable property; attachment and sale of " +
      "immovable property; attachment of bank accounts; and such other coercive process as the Act permits, together with such interest " +
      "and penalty as may accrue for the period of default.",
    complianceDays: 15,
  },
  disputes_tax_amount: {
    title: "Notice of Demand with Intimation of Right to Object",
    legalBasis: "Section 127 of the Bihar Municipal Act, 2007, read with the Bihar Property Tax (Assessment, Collection and Recovery) Rules, 2013",
    body:
      "This is to inform {ownerName}, owner/occupier of Holding No. {holdingNo} situated at {address}, Ward No. {ward}, that as per Demand " +
      "Notice No. {demandNo} attached herewith, a sum of Rs. {totalAmountDemanded}/- stands assessed and due as Property Tax on the said " +
      "holding, computed on its Annual Rental Value in accordance with Section 127 of the Bihar Municipal Act, 2007 and the Rules made " +
      "thereunder. " +
      "\n\nOn {reportedDate} the Tax Collector of this Municipality visited the said holding for collection of the above dues, and it is " +
      "reported that {ownerName} disputes the correctness of the amount so assessed and demanded, on the following stated grounds: " +
      "\"{issueNotes}\" " +
      "\n\n{ownerName} is hereby given the opportunity to submit a written objection to the assessment, along with supporting documents, " +
      "to this Municipality within {complianceDays} days of the date of this notice. The objection shall be examined and disposed of in " +
      "accordance with the applicable provisions for revision of assessment. If no objection is received within the said period, the " +
      "amount stated in the attached Demand Notice shall be treated as final and due, and shall be recoverable as an arrear of tax under " +
      "Section 158 of the Act without further reference to this dispute.",
    complianceDays: 21,
  },
  disputes_solid_waste_amount: {
    title: "Notice of Demand for Solid Waste Management User Charges",
    legalBasis: "Section 127 and Section 158 (as amended by the Bihar Municipal (Amendment) Act, 2011) of the Bihar Municipal Act, 2007",
    body:
      "This is to inform {ownerName}, owner/occupier of Holding No. {holdingNo} situated at {address}, Ward No. {ward}, that Solid Waste " +
      "Management User Charges, forming part of the total amount of Rs. {totalAmountDemanded}/- shown in Demand Notice No. {demandNo} " +
      "attached herewith, stand levied and due in respect of the said holding under the provisions of the Bihar Municipal Act, 2007 " +
      "governing the levy and recovery of user charges. " +
      "\n\nOn {reportedDate} the Tax Collector of this Municipality visited the said holding for collection of the above dues, and it is " +
      "reported that {ownerName} disputes the amount so levied as Solid Waste Management User Charges, on the following stated grounds: " +
      "\"{issueNotes}\" " +
      "\n\n{ownerName} is hereby given the opportunity to submit a written objection, along with supporting documents concerning the " +
      "category or usage of the holding relevant to the charge, to this Municipality within {complianceDays} days of the date of this " +
      "notice. If no objection is received within the said period, the User Charge shown in the attached Demand Notice shall be treated " +
      "as final and due, and shall be recoverable along with Property Tax as an arrear under Section 158 of the Act.",
    complianceDays: 21,
  },
  absent_door_locked: {
    title: "Notice of Intimation - Holding Found Locked/Inaccessible",
    legalBasis: "The Bihar Property Tax (Assessment, Collection and Recovery) Rules, 2013 (provision for a holding found locked or inaccessible)",
    body:
      "This is to inform {ownerName}, owner/occupier of Holding No. {holdingNo} situated at {address}, Ward No. {ward}, that on " +
      "{reportedDate} the Tax Collector of this Municipality visited the said holding for collection of Property Tax dues of Rs. " +
      "{totalAmountDemanded}/- as per Demand Notice No. {demandNo} attached herewith, and found the holding locked and/or the occupant " +
      "not available, such that collection could not be effected. " +
      "\n\n{ownerName} is hereby requested to remain present at the said holding, or to depute an authorised representative, on the next " +
      "visit of the Tax Collector, or alternatively to make payment of the outstanding amount directly at the Municipal counter within " +
      "{complianceDays} days of the date of this notice. Failure to make payment or to remain available for collection within the said " +
      "period shall be treated as continued default, and the Municipality shall be entitled to proceed with recovery of the outstanding " +
      "amount, together with applicable interest and penalty, as an arrear of tax under Section 158 of the Bihar Municipal Act, 2007.",
    complianceDays: 10,
  },
  under_construction: {
    title: "Notice of Provisional Assessment - Holding Under Construction",
    legalBasis: "Section 127(4) of the Bihar Municipal Act, 2007, read with the Bihar Property Tax (Assessment, Collection and Recovery) Rules, 2013",
    body:
      "This is to inform {ownerName}, owner/occupier of Holding No. {holdingNo} situated at {address}, Ward No. {ward}, that on " +
      "{reportedDate} the Tax Collector of this Municipality visited the said holding for collection of dues of Rs. {totalAmountDemanded}/- " +
      "as per Demand Notice No. {demandNo} attached herewith, and reported that construction on the holding is stated to be incomplete: " +
      "\"{issueNotes}\" " +
      "\n\n{ownerName} is hereby directed to intimate this Municipality, within {complianceDays} days of the date of this notice, of the " +
      "present stage of construction and the extent of covered/built-up area actually completed on the holding, supported by such " +
      "evidence as may be required, so that the assessment may be revised, if warranted, in accordance with the classification of vacant " +
      "and partly-constructed land under the Bihar Property Tax (Assessment, Collection and Recovery) Rules, 2013. Until any such revision " +
      "is made and approved, the amount stated in the attached Demand Notice shall continue to be due and payable, and shall remain " +
      "recoverable as an arrear of tax under Section 158 of the Act if not paid or duly disputed within the said period.",
    complianceDays: 21,
  },
  disputes_measurement: {
    title: "Notice of Re-Measurement and Verification of Carpet Area",
    legalBasis: "Section 127(6) of the Bihar Municipal Act, 2007, read with the Bihar Property Tax (Assessment, Collection and Recovery) Rules, 2013",
    body:
      "This is to inform {ownerName}, owner/occupier of Holding No. {holdingNo} situated at {address}, Ward No. {ward}, that on " +
      "{reportedDate} the Tax Collector of this Municipality visited the said holding for collection of dues of Rs. {totalAmountDemanded}/- " +
      "as per Demand Notice No. {demandNo} attached herewith, and it is reported that {ownerName} disputes the carpet area/measurement of " +
      "the holding on which the assessment is based, on the following stated grounds: \"{issueNotes}\" " +
      "\n\n{ownerName} is hereby given the opportunity to request a re-measurement of the holding by remaining present, or deputing an " +
      "authorised representative, for a joint measurement to be conducted by this Municipality within {complianceDays} days of the date " +
      "of this notice, in accordance with the carpet-area measurement provisions of Section 127(6) of the Bihar Municipal Act, 2007 and " +
      "the Rules made thereunder. If no such request is made, or the holding is not made available for re-measurement, within the said " +
      "period, the measurement on record and the amount stated in the attached Demand Notice shall be treated as final and due, and shall " +
      "be recoverable as an arrear of tax under Section 158 of the Act.",
    complianceDays: 21,
  },
};
