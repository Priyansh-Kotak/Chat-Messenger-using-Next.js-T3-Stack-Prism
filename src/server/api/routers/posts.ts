import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { filterUserForClient } from "~/server/helpers/FilterUserForClients";

import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis"; // see below for cloudflare and fastly adapters

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */ 
  prefix: "@upstash/ratelimit",
});

export const postRouter = createTRPCRouter({
  
  getAll: publicProcedure.query(async({ ctx }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    // return ctx.prisma.post.findMany();
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy:[{createdAt: "desc"}]
    });

    const users = (
      await clerkClient.users.getUserList({
        userId : posts.map((post) => post.authorId),
        // limit :100,
        

      })
    ).map(filterUserForClient);

    console.log(users);

    return posts.map((post)=>{
      const author = users.find((user)=> user.id === post.authorId);

      if(!author )
      throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message : "Author for the post is not found",
      });

      console.log(author.firstName);
      
      return{
        post,
        author :{
          ...author,
          uername : author.firstName,
        }

      }
      
    });
    
  }),

  create: privateProcedure.input(z.object({content: z.string().emoji("Opps... only emojis are allowed 🤌").min(1).max(280)})).mutation(async({ctx,input})=>{
    const authorId = ctx.userId;

    const {success} = await ratelimit.limit(authorId);

    if(!success) throw new TRPCError({code : "TOO_MANY_REQUESTS"});

    const post = await ctx.prisma.post.create({
      data:{
        authorId,
        content : input.content
      }
    })

    return post;
  })


});