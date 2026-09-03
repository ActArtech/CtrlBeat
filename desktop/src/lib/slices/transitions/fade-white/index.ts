/**
 * Transition slice: fade-white
 * @see manifest.json
 */
import type { TransitionDefinition } from "../../types";
import { t } from "../../shared";

const definition: TransitionDefinition = {
    id: "fade-white",
    get label() { return t("transitions.fade-white.label"); },
    category: "basic",
    get blurb() { return t("transitions.fade-white.blurb"); },
    implemented: true,
    defaultDuration: 1,
};

export default definition;
