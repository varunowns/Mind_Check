import { Link } from "react-router-dom";
import { SparkleIcon } from "./mindcheck-ui";

export const ReminderCard = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;

  return (
    <div className="surface-panel surface-section">
      <p className="eyebrow eyebrow--soft">Evening nudge</p>
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="section-title">A quick check-in could help tonight feel lighter.</h2>
          <p className="body-copy mt-2 max-w-2xl">If you have two quiet minutes, Pebble can help you notice how the day landed and suggest a soft reset.</p>
        </div>
        <Link to="/checkin" className="button-primary">
          <SparkleIcon />
          <span>Start check-in</span>
        </Link>
      </div>
    </div>
  );
};
