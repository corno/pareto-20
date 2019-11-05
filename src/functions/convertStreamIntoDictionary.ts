import { IInKeyValueStream, StreamLimiter } from "pareto-api"
import { ReadOnlyDictionary} from "../classes/heap/ReadOnlyDictionary"
import { UnsafePromise} from "../classes/volatile/UnsafePromise"


export function convertStreamIntoDictionary<DataType, ErrorType>(
    stream: IInKeyValueStream<DataType>,
    limiter: StreamLimiter,
    keyConflictErrorCreator: (aborted: boolean, errors: ReadOnlyDictionary<DataType[]>) => ErrorType
) {
    let isExecuted = false

    return new UnsafePromise<ReadOnlyDictionary<DataType>, ErrorType>((onErrors, onSuccess) => {
        if (isExecuted === true) {
            throw new Error("all promise is already executed")
        }
        isExecuted = true

        const result: { [key: string]: DataType } = {}
        const errors: { [key: string]: DataType[] } = {}
        let hasKeyConflicts = false
        stream.process(
            limiter,
            kvPair => {
                const key = kvPair.key
                if (result[key] === undefined) {
                    result[key] = kvPair.value
                } else {
                    //key conflict
                    hasKeyConflicts = true
                    if (errors[key] === undefined) {
                        //first time this key clashes, copy the value from the result dictionary into the error dictionary
                        errors[key] = [result[key]]
                    }
                    errors[key].push(kvPair.value)
                }
            },
            aborted => {
                if (hasKeyConflicts) {
                    onErrors(keyConflictErrorCreator(aborted, new ReadOnlyDictionary(errors)))
                } else {
                    onSuccess(new ReadOnlyDictionary(result))
                }
            }
        )
    })
}
