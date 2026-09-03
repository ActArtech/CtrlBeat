/**
 * Transition slice: zoom
 * @see manifest.json
 */
import type { TransitionDefinition } from "../../types";
import { t } from "../../shared";

const definition: TransitionDefinition = {
    id: "zoom",
    get label() { return t("transitions.zoom.label"); },
    category: "motion",
    get blurb() { return t("transitions.zoom.blurb"); },
    implemented: false,
    defaultDuration: 0.8,
};

export default definition;
