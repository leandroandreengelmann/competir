import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Pencil } from "lucide-react"
import { listOrganizersAction } from "@/app/actions/organizers"

export default async function OrganizadoresPage() {
    // Buscar organizadores do banco
    const organizers = await listOrganizersAction()

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organizadores</h1>
                    <p className="text-muted-foreground mt-2">
                        Gerencie os organizadores cadastrados no sistema.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/painel/super-admin/organizadores/novo">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Organizador
                    </Link>
                </Button>
            </div>

            {/* Main Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Organizadores</CardTitle>
                    <CardDescription>
                        Visualize e gerencie todos os organizadores
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {organizers.length === 0 ? (
                                /* Empty State */
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64">
                                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-semibold text-foreground">
                                                    Nenhum organizador cadastrado
                                                </h3>
                                                <p className="text-sm text-muted-foreground max-w-sm">
                                                    Comece adicionando um novo organizador ao sistema.
                                                    Eles poderão gerenciar eventos e competições.
                                                </p>
                                            </div>
                                            <Button asChild>
                                                <Link href="/painel/super-admin/organizadores/novo">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Cadastrar Organizador
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                /* Data Rows */
                                organizers.map((organizer) => (
                                    <TableRow key={organizer.id}>
                                        <TableCell className="font-medium">{organizer.name}</TableCell>
                                        <TableCell>{organizer.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="success">Ativo</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/painel/super-admin/organizadores/editar/${organizer.id}`}>
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
