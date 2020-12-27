
import { IUnsafeValue } from "./value/IUnsafeValue"
import { createUnsafeValue } from "./value/createUnsafeValue"

/**
 * This function creates an UnsafeValue and expects handlers for both cases;
 * the input value is null or the input value is not null
 * @param value
 * @param onNull
 * @param onNotNull
 * @returns an UnsafeValue
 */
export function assertNotNull<InputType, ResultType, ErrorType>(
    value: null | InputType,
    onNull: () => ErrorType,
    onNotNull: (
        input: InputType
    ) => ResultType
): IUnsafeValue<ResultType, ErrorType> {
    return createUnsafeValue<ResultType, ErrorType>((onError, onSuccess) => {
        if (value === null) {
            onError(onNull())
        } else {
            onSuccess(onNotNull(value))
        }
    })
}

export function onNullableValue<InputType, ResultType>(value: null | InputType, onNull: () => ResultType, onNotNull: (input: InputType) => ResultType): ResultType {
    if (value === null) {
        return onNull()
    } else {
        return onNotNull(value)
    }
}


/**
 * This function transforms a boolean into an UnsafeValue.
 * 'true' leads to a success state
 * 'false' leads to an error state
 * @param value
 * @param onNull
 * @param onNotNull
 * @returns an UnsafeValue
 */
export function assertTrue<ResultType, ErrorType>(value: boolean, onFalse: () => ErrorType, onTrue: () => ResultType): IUnsafeValue<ResultType, ErrorType> {
    return createUnsafeValue<ResultType, ErrorType>((onError, onSuccess) => {
        if (value) {
            onSuccess(onTrue())
        } else {
            onError(onFalse())
        }
    })
}

/**
 * This function executes 1 of 2 calbacks based on a boolean and returns a value
 * it serves the same function as what a conditional operator ( value ? onTrue : onFalse ) can do
 * be aware that onFalse comes before onTrue
 * @param value
 * @param onFalse
 * @param onTrue
 */
export function onBoolean<ResultType>(value: boolean, onFalse: () => ResultType, onTrue: () => ResultType): ResultType {
    if (value) {
        return onTrue()
    } else {
        return onFalse()
    }
}
