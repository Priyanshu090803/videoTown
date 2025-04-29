class ApiError extends Error{
    constructor(
        statusCode,
        message= "Something went wrong",
        errors=[],
        stack= ""
    ){
        super(message)   // yha pe super ka default message  Something went wrong  hoga       
        // super wala apne parent class jisse extend hui ye class usme target karta h
        this.statusCode=statusCode
        this.data= null       // ye or iske niche wala hardcoded data h mllb kuch bhi parameters dal lo 
        this.sucess=false        // ye dono to add hoke ayenge hi ayenge => mllb data null and sucess false hogi hi hogi hmesa kuki ye Api error hai
        this.errors= errors

        if(stack){
            this.stack = this.stack
        }
        else{
            Error.captureStackTrace(this , this.constructor)
        }

    }

}

export {ApiError}






