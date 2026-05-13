import TopBar from "@/components/dashboard/creator/TopBar";
import MessagesLayout from "@/components/dashboard/messaging/MessagesLayout";

export default function CreatorMessagesLayout({ children }) {
  return (
    <>
      <TopBar title="Messages" />
      <MessagesLayout
        role="creator"
        basePath="/dashboard/creator/messages"
        emptyCopy="Once a brand accepts your application, your conversation will show up here."
        intro="Conversations open once a brand accepts your application."
      >
        {children}
      </MessagesLayout>
    </>
  );
}
