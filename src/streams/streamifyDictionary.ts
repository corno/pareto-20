import {
    KeyValuePair,
    StreamLimiter,
} from "pareto-api"

export function streamifyDictionary<ElementType>(dictionary: { [key: string]: ElementType }) {
    const keys = Object.keys(dictionary)
    return (limiter: null | StreamLimiter, onData: (data: KeyValuePair<ElementType>, abort: () => void) => void, onEnd: (aborted: boolean) => void) => {
        function pushData(theArray: string[], limited: boolean) {
            let abort = false
            theArray.forEach(key => {
                if (!abort) {
                    onData(
                        { key: key, value: dictionary[key]},
                        () => {
                            abort = true
                        }
                    )
                }
            })
            onEnd(limited || abort)
        }
        if (limiter !== null && limiter.maximum < keys.length) {
            if (limiter.abortEarly) {
                onEnd(true)
            } else {
                pushData(keys.slice(0, limiter.maximum), true)
            }
        } else {
            pushData(keys, false)
        }
    }
}
