
import { IUnsafeValue} from "./value/IUnsafeValue"
import { createUnsafeValue } from "./value/createUnsafeValue"

export function assertNotNull<InputType, ResultType, ErrorType>(
    value: null | InputType,
    onNull: () => ErrorType,
    onNotNull: (input: InputType
) => ResultType): IUnsafeValue<ResultType, ErrorType> {
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


export function assertTrue<ResultType, ErrorType>(value: boolean, onFalse: () => ErrorType, onTrue: () => ResultType): IUnsafeValue<ResultType, ErrorType> {
    return createUnsafeValue<ResultType, ErrorType>((onError, onSuccess) => {
        if (value) {
            onSuccess(onTrue())
        } else {
            onError(onFalse())
        }
    })
}

export function onBoolean<ResultType>(value: boolean, onFalse: () => ResultType, onTrue: () => ResultType): ResultType {
    if (value) {
        return onTrue()
    } else {
        return onFalse()
    }
}
