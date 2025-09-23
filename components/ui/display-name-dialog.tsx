import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface DisplayNameDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function DisplayNameDialog({ isOpen, onClose }: DisplayNameDialogProps) {
  const router = useRouter()

  const handleGoToSettings = () => {
    router.push('/settings/profile')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ユーザーネームの設定が必要です</DialogTitle>
          <DialogDescription>
            この機能を使用するには、まずユーザーネーム（表示名）の設定が必要です。
            設定ページでユーザーネームを設定してください。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleGoToSettings}>
            設定ページへ移動
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}