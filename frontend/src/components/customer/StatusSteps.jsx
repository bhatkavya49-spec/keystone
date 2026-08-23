const STATUS_STEPS = ["NEW", "ASSIGNED", "IN_PROGRESS", "COMPLETED"];

export default function StatusSteps({ status }) {
  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <ol className="status-steps">
      {STATUS_STEPS.map((step, index) => {
        const done = currentIndex > index;
        const current = currentIndex === index;
        const classes = ["status-steps__item"];
        if (done) classes.push("status-steps__item--done");
        if (current) classes.push("status-steps__item--current");
        return (
          <li key={step} className={classes.join(" ")}>
            <span className="status-steps__dot" />
            <span className="status-steps__label">{step.replace("_", " ")}</span>
          </li>
        );
      })}
    </ol>
  );
}