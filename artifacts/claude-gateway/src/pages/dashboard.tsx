import { useState } from "react";
  import {
    useListApiKeys,
    useCreateApiKey,
    useDeleteApiKey,
    useGetApiKeyStats,
    getListApiKeysQueryKey,
    getGetApiKeyStatsQueryKey
  } from "@workspace/api-client-react";
  import { useQueryClient } from "@tanstack/react-query";
  import { Button } from "@/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
  import { Badge } from "@/components/ui/badge";
  import { useToast } from "@/hooks/use-toast";
  import { KeyRound, Check, Copy, Trash2, Plus, Activity, Clock, TerminalSquare, AlertCircle } from "lucide-react";
  import { format } from "date-fns";

  export default function Dashboard() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: keys = [], isLoading: isLoadingKeys } = useListApiKeys();
    const { data: stats, isLoading: isLoadingStats } = useGetApiKeyStats();

    const createMutation = useCreateApiKey();
    const deleteMutation = useDeleteApiKey();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState(false);
    const [copiedCurl, setCopiedCurl] = useState(false);

    const handleCreate = async () => {
      if (!newKeyName.trim()) return;
      try {
        const result = await createMutation.mutateAsync({ data: { name: newKeyName.trim() } });
        setRevealedKey(result.fullKey);
        setNewKeyName("");
        queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetApiKeyStatsQueryKey() });
        toast({ title: "API Key Created", description: "Your new API key has been generated." });
      } catch {
        toast({ title: "Error", description: "Failed to create API key.", variant: "destructive" });
      }
    };

    const handleDelete = async (id: number) => {
      try {
        await deleteMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetApiKeyStatsQueryKey() });
        toast({ title: "API Key Deleted", description: "The API key has been permanently removed." });
      } catch {
        toast({ title: "Error", description: "Failed to delete API key.", variant: "destructive" });
      }
    };

    const copyToClipboard = (text: string, type: "key" | "curl") => {
      navigator.clipboard.writeText(text);
      if (type === "key") { setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); }
      else { setCopiedCurl(true); setTimeout(() => setCopiedCurl(false), 2000); }
    };

    const getCurlExample = (key: string) => {
      const domain = typeof window !== "undefined" ? window.location.origin : "https://api.yourdomain.com";
      return `curl ${domain}/api/v1/chat/completions \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer ${key}" \\
    -d '{
      "model": "claude-opus-4-7",
      "messages": [
        {
          "role": "user",
          "content": "مرحبا، عطني نصيحة سريعة لليوم."
        }
      ]
    }'`;
    };

    return (
      <div className="min-h-screen bg-background text-foreground p-6 md:p-12 font-sans">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <TerminalSquare className="w-8 h-8 text-primary" />
                Claude Gateway
              </h1>
              <p className="text-muted-foreground mt-1">Manage your API keys for OpenAI-compatible Claude endpoint.</p>
            </div>

            <Dialog open={createDialogOpen} onOpenChange={(open) => {
              if (!open && revealedKey) setRevealedKey(null);
              setCreateDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-key">
                  <Plus className="w-4 h-4 mr-2" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" data-testid="dialog-create-key">
                {!revealedKey ? (
                  <>
                    <DialogHeader>
                      <DialogTitle>Create new API key</DialogTitle>
                      <DialogDescription>This key will allow access to the Claude gateway.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Key Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Production App"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                          data-testid="input-key-name"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreate} disabled={!newKeyName.trim() || createMutation.isPending} data-testid="button-submit-key">
                        {createMutation.isPending ? "Creating..." : "Create Secret Key"}
                      </Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-500" />
                        API Key Generated
                      </DialogTitle>
                      <DialogDescription className="text-destructive font-medium flex items-center gap-1.5 mt-2">
                        <AlertCircle className="w-4 h-4" />
                        This key will only be shown once. Copy it now.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label>Secret Key</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-sm border border-border break-all">
                            {revealedKey}
                          </code>
                          <Button size="icon" variant="outline" onClick={() => copyToClipboard(revealedKey, "key")} data-testid="button-copy-key">
                            {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Example Usage</Label>
                        <div className="relative group">
                          <pre className="bg-[#0d1117] p-4 rounded-md overflow-x-auto border border-border">
                            <code className="text-sm font-mono text-blue-300">{getCurlExample(revealedKey)}</code>
                          </pre>
                          <Button
                            size="icon" variant="secondary"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(getCurlExample(revealedKey), "curl")}
                            data-testid="button-copy-curl"
                          >
                            {copiedCurl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => { setRevealedKey(null); setCreateDialogOpen(false); }}>Done</Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <KeyRound className="w-4 h-4" /> Total Keys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingStats ? "..." : stats?.totalKeys ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Active Keys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">{isLoadingStats ? "..." : stats?.activeKeys ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Total Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingStats ? "..." : stats?.totalRequests ?? 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Keys Table */}
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage and revoke your active API keys.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingKeys ? (
                <div className="flex justify-center p-8 text-muted-foreground">Loading keys...</div>
              ) : keys.length === 0 ? (
                <div className="text-center p-12 border border-dashed border-border rounded-lg bg-muted/20">
                  <KeyRound className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">No API keys yet</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                    Create an API key to start using the Claude gateway with your applications.
                  </p>
                  <Button variant="outline" className="mt-6" onClick={() => setCreateDialogOpen(true)}>
                    Create your first key
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead>Name</TableHead>
                        <TableHead>Key Prefix</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Requests</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keys.map((key) => (
                        <TableRow key={key.id} className="group hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">{key.name}</TableCell>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono border border-border/50">
                              {key.keyPrefix}••••••••••••
                            </code>
                          </TableCell>
                          <TableCell>
                            {key.isActive
                              ? <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>
                              : <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Revoked</Badge>
                            }
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(key.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{key.requestCount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost" size="icon"
                              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                              onClick={() => handleDelete(key.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-key-${key.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    );
  }
  