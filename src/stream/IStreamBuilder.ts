export interface IStreamBuilder<DataType> {
    push(element: DataType): void
}
