[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)][string]$LabId,
    [string]$Prefix = 'rg-sc500-lab'
)
$name = "$Prefix-$LabId"
if ($PSCmdlet.ShouldProcess($name, 'Remove resource group')) {
    Remove-AzResourceGroup -Name $name -Force
}