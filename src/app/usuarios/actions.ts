'use server'

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function createUserAction(formData: FormData) {
  const username = (formData.get('username') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const nombre = (formData.get('nombre') as string)?.trim()
  const role = formData.get('role') as string
  const sucursalesIds = JSON.parse(formData.get('sucursalesIds') as string || '[]') as string[]
  const bodegasIds = JSON.parse(formData.get('bodegasIds') as string || '[]') as string[]

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
        role,
        sucursales: {
          connect: sucursalesIds.map(id => ({ id }))
        },
        bodegas: {
          connect: bodegasIds.map(id => ({ id }))
        }
      }
    })

    revalidatePath('/usuarios')
    return { success: true }
  } catch (error) {
    return { error: "Ocurrió un error al crear el usuario." }
  }
}

export async function updateUserAction(userId: string, formData: FormData) {
  const username = (formData.get('username') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const nombre = (formData.get('nombre') as string)?.trim()
  const role = formData.get('role') as string
  const sucursalesIds = JSON.parse(formData.get('sucursalesIds') as string || '[]') as string[]
  const bodegasIds = JSON.parse(formData.get('bodegasIds') as string || '[]') as string[]

  if (!userId || !username || !nombre || !role) {
    return { error: "Por favor rellena todos los campos obligatorios." }
  }

  try {
    // Check if username is taken by another user
    const existing = await prisma.user.findFirst({
      where: {
        username,
        id: { not: userId }
      }
    })
    if (existing) {
      return { error: "El nombre de usuario ya está registrado por otra cuenta." }
    }

    const dataToUpdate: any = {
      username,
      nombre,
      role,
      sucursales: {
        set: sucursalesIds.map(id => ({ id }))
      },
      bodegas: {
        set: bodegasIds.map(id => ({ id }))
      }
    }

    if (password && password.trim() !== '') {
      dataToUpdate.password = bcrypt.hashSync(password, 10)
    }

    await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate
    })

    revalidatePath('/usuarios')
    return { success: true }
  } catch (error) {
    return { error: "Ocurrió un error al actualizar el usuario." }
  }
}

export async function deleteUserAction(userId: string) {
  if (!userId) {
    return { error: "ID de usuario inválido." }
  }

  try {
    // Check if user has associated movements
    const movementsCount = await prisma.movimiento.count({
      where: { usuarioId: userId }
    })

    if (movementsCount > 0) {
      return { error: "No se puede eliminar este usuario porque tiene movimientos de inventario registrados a su nombre." }
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    revalidatePath('/usuarios')
    return { success: true }
  } catch (error) {
    return { error: "Ocurrió un error al intentar eliminar el usuario." }
  }
}

