import { MessageSquareText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminAIConversationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500">
          <MessageSquareText className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">AI Conversations</h1>
          <p className="text-sm text-slate-500">Monitor and review AI tutor conversation history</p>
        </div>
      </div>
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader><CardTitle className="text-base">Conversation Monitor</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">AI conversation monitoring and review interface coming soon. You'll be able to review flagged conversations, monitor quality, and track usage patterns.</p>
        </CardContent>
      </Card>
    </div>
  );
}
