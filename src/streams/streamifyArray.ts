
import { StreamGetter } from "./IStream"

export function streamifyArray<ElementType>(array: ElementType[]): StreamGetter<ElementType> {
    return (limiter, onData, onEnd) => {
        function pushData(theArray: ElementType[], limited: boolean) {
            let abort = false
            theArray.forEach(element => {
                if (!abort) {
                    onData(
                        element,
                        () => {
                            abort = true
                        }
                    )
                }
            })
            onEnd(limited || abort)
        }
        if (limiter !== null && limiter.maximum < array.length) {
            if (limiter.abortEarly) {
                onEnd(true)
            } else {
                pushData(array.slice(0, limiter.maximum), true)
            }
        } else {
            pushData(array, false)
        }
    }
}
