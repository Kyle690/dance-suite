import { createSafeActionClient } from "next-safe-action";
import { redirect } from "next/navigation";

export const safeAction = createSafeActionClient({

}).use(async({ next, clientInput, ctx })=>{
    const user =  {
        id: 'c4167ebc-2069-43ef-9635-e15edae90139',
        emailAddresses:[ { emailAddress:'test@mail.com' } ],
        fullName:'Test User',
        firstName:'Test'
    }

    try{
        if(!user){
            throw new Error('Authentication required');
        }


        return next({
            ...clientInput as unknown as object,
            ctx:{
                ...ctx,
                user:{
                    name: user.fullName || user.firstName || 'User',
                    email: user.emailAddresses[0]?.emailAddress || null,
                    id: user.id
                }
            }
        })
    }catch (error){
        console.error('Error verifying session cookie', error);
        redirect('/');
    }
})
