// import { KeyValueStream } from "./KeyValueStream"
// import { streamifyDictionary } from "./streamifyDictionary"

// /**
//  * allows for building a key value stream by calling the 'set' method
//  */
// export class BuildableKeyValueStream<DataType, ReturnType, EndDataType> extends KeyValueStream<DataType, ReturnType, EndDataType> {
//     private readonly dictionary: { [key: string]: DataType }
//     constructor(
//         endData: EndDataType,
//     ) {
//         const dictionary: { [key: string]: DataType } = {}

//         super(streamifyDictionary(dictionary))
//         this.dictionary = dictionary
//     }
//     public set(key: string, element: DataType): void {
//         this.dictionary[key] = element
//     }
//     // public get(key: string, initializer: () => DataType) {
//     //     let entry = this.dictionary[key]
//     //     if (entry === undefined) {
//     //         entry = initializer()
//     //         this.dictionary[key] = entry
//     //     }
//     //     return entry
//     // }
// }
