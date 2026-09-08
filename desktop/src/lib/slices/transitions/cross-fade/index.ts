/**
 * Transition slice: cross-fade
 * @see manifest.json
 */
import type { TransitionDefinition } from "../../types";
import { t } from "../../shared";

const definition: TransitionDefinition = {
    id: "cross-fade",
    get label() { return t("transitions.cross-fade.label"); },
    category: "basic",
    get blurb() { return t("transitions.cross-fade.blurb"); },
    implemented: true,
    defaultDuration: 1,
};

export default definition;
