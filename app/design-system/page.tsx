"use client"

import { Bell, Check, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/layout/page-header"

export default function DesignSystemPage() {
    return (
        <DashboardLayout>
            <PageHeader
                title="Design System Verification"
                description="A kitchen sink page to test all components and tokens."
            >
                <Button variant="outline">Secondary Action</Button>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Primary Action
                </Button>
            </PageHeader>

            <div className="space-y-8">
                {/* Buttons Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Buttons</h2>
                    <div className="flex flex-wrap gap-4">
                        <Button>Default</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="destructive">Destructive</Button>
                        <Button variant="link">Link</Button>
                        <Button size="sm">Small</Button>
                        <Button size="lg">Large</Button>
                        <Button disabled>Disabled</Button>
                        <Button>
                            <Bell className="mr-2 h-4 w-4" /> With Icon
                        </Button>
                    </div>
                </section>

                {/* Badges Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Badges</h2>
                    <div className="flex flex-wrap gap-4">
                        <Badge>Default</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="outline">Outline</Badge>
                        <Badge variant="success">Success</Badge>
                        <Badge variant="warning">Warning</Badge>
                        <Badge variant="destructive">Error</Badge>
                        <Badge variant="info">Info</Badge>
                    </div>
                </section>

                {/* Forms Section */}
                <section className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Form Elements</CardTitle>
                            <CardDescription>
                                Inputs, Selects, and Textareas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Input</label>
                                <Input placeholder="Type something..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select</label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Option 1</SelectItem>
                                        <SelectItem value="2">Option 2</SelectItem>
                                        <SelectItem value="3">Option 3</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Textarea</label>
                                <Textarea placeholder="Type description..." />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full">Submit</Button>
                        </CardFooter>
                    </Card>

                    {/* Dialog & Tabs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Interactive</CardTitle>
                            <CardDescription>Tabs and Dialogs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="account" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="account">Account</TabsTrigger>
                                    <TabsTrigger value="password">Password</TabsTrigger>
                                </TabsList>
                                <TabsContent value="account" className="p-4 border rounded-md mt-2">
                                    Account settings here.
                                </TabsContent>
                                <TabsContent value="password" className="p-4 border rounded-md mt-2">
                                    Password settings here.
                                </TabsContent>
                            </Tabs>

                            <div className="mt-6">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">Open Dialog</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Are you absolutely sure?</DialogTitle>
                                            <DialogDescription>
                                                This action cannot be undone.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button type="submit">Confirm</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Table Section */}
                <section>
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Table</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">INV001</TableCell>
                                        <TableCell>
                                            <Badge variant="success">Paid</Badge>
                                        </TableCell>
                                        <TableCell>Credit Card</TableCell>
                                        <TableCell className="text-right">$250.00</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">INV002</TableCell>
                                        <TableCell>
                                            <Badge variant="warning">Pending</Badge>
                                        </TableCell>
                                        <TableCell>PayPal</TableCell>
                                        <TableCell className="text-right">$150.00</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </DashboardLayout>
    )
}
