export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-hairline pt-5 text-center dark:border-hairline-dark">
      <p className="font-sans text-xs text-ink/45 dark:text-ink-dark/45">
        Developed by{" "}
        <a
          href="https://www.naimurrahman.info.bd/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-ink/70 underline decoration-ink/20 underline-offset-2 transition-colors hover:text-stamp hover:decoration-stamp/40 dark:text-ink-dark/70 dark:decoration-ink-dark/20 dark:hover:text-stamp-dark dark:hover:decoration-stamp-dark/40"
        >
          Naimur
        </a>
      </p>
    </footer>
  );
}
