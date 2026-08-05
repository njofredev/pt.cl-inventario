'use server'

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function createUserAction(formData: FormData) {
  const username = (formData.get('username') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const nombre = (formData.get('nombre') as string)?.trim()
  const role = formData.get('role') as string

  if (!username || !password || !nombre || !role) {
    return { error: "Por favor rellena todos los campos." }
  }

  try {
    // Check if username already exists
    const existing = await prisma.user.findUnique({
      where: { username }
    })
    if (existing) {
      return { error: "El nombre de usuario ya está registrado." }
    }

    const hashedPassword = bcrypt.hashSync(password, 10)

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        nombre,
        role
      }
    })

    revalidatePath('/usuarios')
    return { success: true }
  } catch (error) {
    return { error: "Ocurrió un error al crear el usuario." }
  }
}
