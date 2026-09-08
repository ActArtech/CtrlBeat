/**
 * Transition slice: wipe-right
 * @see manifest.json
 */
import type { TransitionDefinition } from "../../types";
import { t } from "../../shared";

const definition: TransitionDefinition = {
    id: "wipe-right",
    get label() { return t("transitions.wipe-right.label"); },
    category: "motion",
    get blurb() { return t("transitions.wipe-right.blurb"); },
    implemented: true,
    defaultDuration: 0.8,
};

export default definition;
