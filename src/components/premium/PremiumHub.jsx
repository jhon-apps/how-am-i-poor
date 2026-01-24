import PremiumContent from "@/components/premium/PremiumContent"

export default function PremiumHub({ open, onClose, onBillingNotReady }) {
    if (!open) return null

    return <PremiumContent mode="modal" onClose={onClose} onBillingNotReady={onBillingNotReady} />
}
