import * as api from "pareto-api"
import { ProcessKeyValueStreamFunction } from "./KeyValueStream"

export function streamifyDictionary<ElementType>(
    dictionary: { [key: string]: ElementType },
): ProcessKeyValueStreamFunction<ElementType, boolean, null> {
    const keys = Object.keys(dictionary)
    return (
        limiter: null | api.StreamLimiter,
        onData: (
            data: api.KeyValuePair<ElementType>,
            abort: () => void
        ) => void,
        onEnd: (aborted: boolean, data: null) => void
    ): void => {
        function pushData(theArray: string[], limited: boolean) {
            let abort = false
            theArray.forEach(key => {
                if (!abort) {
                    onData(
                        { key: key, value: dictionary[key] },
                        () => {
                            abort = true
                        }
                    )
                }
            })
            onEnd(limited || abort, null)
        }
        if (limiter !== null && limiter.maximum < keys.length) {
            if (limiter.abortEarly) {
                onEnd(true, null)
            } else {
                pushData(keys.slice(0, limiter.maximum), true)
            }
        } else {
            pushData(keys, false)
        }
    }
}
