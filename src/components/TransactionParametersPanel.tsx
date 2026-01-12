import { FormField } from "@/helpers/FormField"
import { FormSection } from "@/helpers/FormSection"
import { TransactionParameters } from "@/types/snowplow"

export interface TransactionParametersPanelProps {
  transactionParams: TransactionParameters
  setTransactionParams: (transactionParams: TransactionParameters) => void
}

export const TransactionParametersPanel = ({ transactionParams, setTransactionParams }: TransactionParametersPanelProps) => {
  return <FormSection title="Transaction Parameters">
  <div className="grid grid-cols-2 gap-4">
    <FormField
      label="Order ID (tr_id)"
      value={transactionParams.tr_id ?? ''}
      onChange={(v) => setTransactionParams({ ...transactionParams, tr_id: v })}
      fieldName="tr_id"
    />
    <FormField
      label="Affiliation (tr_af)"
      value={transactionParams.tr_af ?? ''}
      onChange={(v) => setTransactionParams({ ...transactionParams, tr_af: v })}
      fieldName="tr_af"
    />
    <FormField
      label="Total (tr_tt)"
      value={transactionParams.tr_tt?.toString() ?? ''}
      onChange={(v) => setTransactionParams({ ...transactionParams, tr_tt: v ? Number(v) : undefined })}
      type="number"
      fieldName="tr_tt"
    />
    <FormField
      label="Tax (tr_tx)"
      value={transactionParams.tr_tx?.toString() ?? ''}
      onChange={(v) => setTransactionParams({ ...transactionParams, tr_tx: v ? Number(v) : undefined })}
      type="number"
      fieldName="tr_tx"
    />
    <FormField
      label="Shipping (tr_sh)"
      value={transactionParams.tr_sh?.toString() ?? ''}
      onChange={(v) => setTransactionParams({ ...transactionParams, tr_sh: v ? Number(v) : undefined })}
      type="number"
      fieldName="tr_sh"
    />
    <FormField
      label="City (tr_ci)"
      value={transactionParams.tr_ci ?? ''}
      onChange={(v) => setTransactionParams({ ...transactionParams, tr_ci: v })}
      fieldName="tr_ci"
    />
    <FormField
      label="State (tr_st)"
      value={transactionParams.tr_st ?? ''}
      onChange={(v) => setTransactionParams({ ...transactionParams, tr_st: v })}
      fieldName="tr_st"
    />
    <FormField
      label="Country (tr_co)"
      value={transactionParams.tr_co ?? ''}
      onChange={(v) => setTransactionParams({ ...transactionParams, tr_co: v })}
      fieldName="tr_co"
    />
    <FormField
      label="Currency (tr_cu)"
      value={transactionParams.tr_cu ?? ''}
      onChange={(v) => setTransactionParams({ ...transactionParams, tr_cu: v })}
      fieldName="tr_cu"
    />
  </div>
</FormSection>
}