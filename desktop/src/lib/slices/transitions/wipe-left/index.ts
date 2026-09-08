/**
 * Transition slice: wipe-left
 * @see manifest.json
 */
import type { TransitionDefinition } from "../../types";
import { t } from "../../shared";

const definition: TransitionDefinition = {
    id: "wipe-left",
    get label() { return t("transitions.wipe-left.label"); },
    category: "motion",
    get blurb() { return t("transitions.wipe-left.blurb"); },
    implemented: true,
    defaultDuration: 0.8,
};

export default definition;
