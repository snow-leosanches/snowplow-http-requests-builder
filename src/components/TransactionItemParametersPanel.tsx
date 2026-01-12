import { FormField } from "@/helpers/FormField"
import { FormSection } from "@/helpers/FormSection"
import { TransactionItemParameters } from "@/types/snowplow"

export interface TransactionItemParametersPanelProps {
  transactionItemParams: TransactionItemParameters
  setTransactionItemParams: (transactionItemParams: TransactionItemParameters) => void
}

export const TransactionItemParametersPanel = ({ transactionItemParams, setTransactionItemParams }: TransactionItemParametersPanelProps) => {
  return <FormSection title="Transaction Item Parameters">
  <div className="grid grid-cols-2 gap-4">
    <FormField
      label="Order ID (ti_id)"
      value={transactionItemParams.ti_id ?? ''}
      onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_id: v })}
      fieldName="ti_id"
    />
    <FormField
      label="SKU (ti_sk)"
      value={transactionItemParams.ti_sk ?? ''}
      onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_sk: v })}
      fieldName="ti_sk"
    />
    <FormField
      label="Name (ti_nm)"
      value={transactionItemParams.ti_nm ?? ''}
      onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_nm: v })}
      fieldName="ti_nm"
    />
    <FormField
      label="Category (ti_ca)"
      value={transactionItemParams.ti_ca ?? ''}
      onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_ca: v })}
      fieldName="ti_ca"
    />
    <FormField
      label="Price (ti_pr)"
      value={transactionItemParams.ti_pr?.toString() ?? ''}
      onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_pr: v ? Number(v) : undefined })}
      type="number"
      fieldName="ti_pr"
    />
    <FormField
      label="Quantity (ti_qu)"
      value={transactionItemParams.ti_qu?.toString() ?? ''}
      onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_qu: v ? Number(v) : undefined })}
      type="number"
      fieldName="ti_qu"
    />
    <FormField
      label="Currency (ti_cu)"
      value={transactionItemParams.ti_cu ?? ''}
      onChange={(v) => setTransactionItemParams({ ...transactionItemParams, ti_cu: v })}
      fieldName="ti_cu"
    />
  </div>
</FormSection>
}