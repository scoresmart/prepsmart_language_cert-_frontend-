type Props = {
  onOpenNavigator?: () => void;
};

/** Minimal left rail — blank white, no part labels (navigator uses the right tab). */
export function PracticePartSidebar(_props: Props) {
  return (
    <aside
      className="hidden shrink-0 self-stretch border-r border-slate-200 bg-white md:block md:w-14"
      aria-hidden
    />
  );
}
