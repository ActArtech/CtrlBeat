/**
 * Transition slice: fade-black
 * @see manifest.json
 */
import type { TransitionDefinition } from "../../types";
import { t } from "../../shared";

const definition: TransitionDefinition = {
    id: "fade-black",
    get label() { return t("transitions.fade-black.label"); },
    category: "basic",
    get blurb() { return t("transitions.fade-black.blurb"); },
    implemented: true,
    defaultDuration: 1,
};

export default definition;
