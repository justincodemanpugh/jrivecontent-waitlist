import TopBar from "@/components/dashboard/brand/TopBar";
import MessagesLayout from "@/components/dashboard/messaging/MessagesLayout";

export default function BrandMessagesLayout({ children }) {
  return (
    <>
      <TopBar title="Messages" />
      <MessagesLayout
        role="brand"
        // The Creators sub-tabs add h-11 above.
        heightClass="h-[calc(100vh-10.75rem)] lg:h-[calc(100vh-6.75rem)]"
        basePath="/dashboard/brand/messages"
        emptyCopy="Accept a creator on one of your gigs to start a conversation."
        intro="Conversations open after you accept a creator's application."
      >
        {children}
      </MessagesLayout>
    </>
  );
}
