import TopBar from "@/components/dashboard/brand/TopBar";
import BoardView from "@/components/dashboard/brand/board/BoardView";

export default function BoardPage() {
  return (
    <>
      <TopBar title="" />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <BoardView />
      </main>
    </>
  );
}
