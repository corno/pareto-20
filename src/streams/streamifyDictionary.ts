import * as api from "pareto-api"
import { ProcessKeyValueStreamFunction } from "./KeyValueStream"

export function streamifyDictionary<ElementType, EndDataType>(
    dictionary: { [key: string]: ElementType },
    endData: EndDataType,
): ProcessKeyValueStreamFunction<ElementType, EndDataType> {
    const keys = Object.keys(dictionary)
    return (
        limiter: null | api.StreamLimiter,
        onData: (
            data: api.KeyValuePair<ElementType>,
            abort: () => void
        ) => void,
        onEnd: (aborted: boolean, data: EndDataType) => void
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
            onEnd(limited || abort, endData)
        }
        if (limiter !== null && limiter.maximum < keys.length) {
            if (limiter.abortEarly) {
                onEnd(true, endData)
            } else {
                pushData(keys.slice(0, limiter.maximum), true)
            }
        } else {
            pushData(keys, false)
        }
    }
}
