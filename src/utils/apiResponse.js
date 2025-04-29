class ApiResponse{
    constructor(statusCode,data,message="sucess"){
        this.statusCode= statusCode
        this.data=data
        this.message=message
        this.sucess = statusCode <400              //response ka status code 300<400 tk hota h  // ye hardcoded data h mllb ye add hoke ayega hi ayega
    }
}


export {ApiResponse}
// kisi ko bhi response bhjenge to yha se bhjenge

// YE CHEEZ HMARE LIYE H