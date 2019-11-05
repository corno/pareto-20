
import { UnsafePromise} from "./classes/volatile/UnsafePromise"
import { IUnsafePromise} from "./interfaces/IUnsafePromise"

export function assertNotNull<InputType, ResultType, ErrorType>(
    value: null | InputType,
    onNull: () => ErrorType,
    onNotNull: (value: InputType
) => ResultType): IUnsafePromise<ResultType, ErrorType> {
    return new UnsafePromise<ResultType, ErrorType>((onError, onSuccess) => {
        if (value === null) {
            onError(onNull())
        } else {
            onSuccess(onNotNull(value))
        }
    })
}

export function onNullableValue<InputType, ResultType>(value: null | InputType, onNull: () => ResultType, onNotNull: (value: InputType) => ResultType): ResultType {
    if (value === null) {
        return onNull()
    } else {
        return onNotNull(value)
    }
}


export function assertTrue<ResultType, ErrorType>(value: boolean, onFalse: () => ErrorType, onTrue: () => ResultType): IUnsafePromise<ResultType, ErrorType> {
    return new UnsafePromise<ResultType, ErrorType>((onError, onSuccess) => {
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

export function assertUnreachable(_never: never) {
    throw new Error("Didn't expect to get here")
}
