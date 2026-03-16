import { createClient } from "@/app/lib/supabase/server";
import { unsafeAction } from "@/app/lib/safeAction";
import { SignUpSchema } from "@/app/schemas/AuthSchema";
import { prisma } from "@/app/lib/prisma";
import { UserTypes } from "@prisma/client";


export const scrutineerSignUp = unsafeAction.inputSchema(SignUpSchema).action(async({ parsedInput })=>{
    const supabase = await createClient();
    try{
        const superbaseUser = await supabase.auth.signUp({
            email:parsedInput.email,
            password:parsedInput.password,
            options: {
                data: {
                    first_name: parsedInput.firstName,
                    last_name: parsedInput.lastName,
                    full_name: `${parsedInput.firstName} ${parsedInput.lastName}`.trim(),
                    role: 'scrutineer',
                },
            },
        })

        if(superbaseUser.error){
            throw new Error(superbaseUser.error.message);
        }

        // TODO - create a stripe customer id for this user.

        await prisma.users.create({
            data:{
                external_id:superbaseUser.data.user?.id,
                user_types:[ UserTypes.SCRUTINEER ]
            }
        });

        const signedInUser = await supabase.auth.signInWithPassword({
            email:parsedInput.email,
            password:parsedInput.password,
        })

        return signedInUser

    }catch (e){
        console.error(e);
    }


})
