import type { Ref } from "vue";

export interface ISize {
    height: Ref<number> ,
    width: Ref<number>,
    offsetHeight: Ref<number>,
    scrollHeight: Ref<number>,
    resize: Function
}