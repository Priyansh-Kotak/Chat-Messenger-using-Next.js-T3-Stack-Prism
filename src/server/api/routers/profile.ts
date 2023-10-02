import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { filterUserForClient } from "~/server/helpers/FilterUserForClients";



export const profileRouter = createTRPCRouter({
    getUserByUsername: publicProcedure.input(z.object({id : z.string()})).query(async({input}) => {
 
            console.log("Input username:", input.id); // Log the username

            const [user]=await clerkClient.users.getUserList({
                userId :[input.id]          

            });
            
            console.log("Retrieved user:", user)
            
    
            if(!user){
                throw new TRPCError({
                    code : "INTERNAL_SERVER_ERROR",
                    message : "user not found"
                });
            }
    
            return filterUserForClient(user);
        
    })

    
  
});
