/**
 * Transition slice: push
 * @see manifest.json
 */
import type { TransitionDefinition } from "../../types";
import { t } from "../../shared";

const definition: TransitionDefinition = {
    id: "push",
    get label() { return t("transitions.push.label"); },
    category: "motion",
    get blurb() { return t("transitions.push.blurb"); },
    implemented: false,
    defaultDuration: 0.8,
};

export default definition;
