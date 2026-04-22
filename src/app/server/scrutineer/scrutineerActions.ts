import { safeAction } from "@/app/lib/safeAction";
import { prisma } from "@/app/lib/prisma";
import { createClient } from "@/app/lib/supabase/server";
import { UpdateProfileSchema } from "@/app/schemas/AuthSchema";



export const getScrutineerInfo = safeAction.action(async({ ctx })=>{

    const user = await prisma.users.findFirst({
        where:{
            uid:ctx.user.id
        },
        include:{
            user_licenses:true,
        }
    });
    if(!user){
        throw new Error('User not found');
    }

    const supabase = await createClient();

    const supabaseUser = await supabase.auth.admin.getUserById(ctx.user.id);

    // TODO - get stripe details at a later stage


    return {
        details:{
            created:supabaseUser.data.user?.created_at,
            first_name:supabaseUser.data.user?.user_metadata?.first_name,
            last_name:supabaseUser.data.user?.user_metadata?.last_name,
            email:supabaseUser.data.user?.user_metadata?.email,
            phone:supabaseUser.data.user?.user_metadata?.phone ||'N/A',
            roles:user.user_types
        },
        licenses:user.user_licenses
    }

})

export const updateScrutineerDetails = safeAction
    .inputSchema(UpdateProfileSchema)
    .action(async ({ parsedInput, ctx }) => {
        const supabase = await createClient();

        const { error } = await supabase.auth.admin.updateUserById(ctx.user.id, {
            user_metadata: {
                first_name: parsedInput.first_name,
                last_name: parsedInput.last_name,
                full_name: `${parsedInput.first_name} ${parsedInput.last_name}`.trim(),
                phone: parsedInput.phone ?? '',
            },
        });

        if (error) {
            throw new Error(error.message);
        }

        return { success: true };
    });

export default {
    getScrutineerInfo,
    updateScrutineerDetails,
}
