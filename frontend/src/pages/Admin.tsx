import { useState } from 'react';
import { adminService } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';

export default function Admin() {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    count?: number;
    error?: string;
  }>({});

  const handleDeleteAllRooms = async () => {
    if (!confirm('Are you sure you want to delete ALL study rooms? This cannot be undone!')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const result = await adminService.deleteAllStudyRooms();
      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need to be logged in to access the admin page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Database Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Study Rooms</h3>
              <p className="text-sm text-gray-500 mb-4">
                Delete all study rooms from the database. This action cannot be undone.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAllRooms}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete All Study Rooms'}
              </Button>
            </div>
          </div>
        </CardContent>
        {(result.success !== undefined) && (
          <CardFooter>
            {result.success ? (
              <Alert>
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Successfully deleted {result.count} study room{result.count !== 1 ? 's' : ''}.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}
          </CardFooter>
        )}
      </Card>
      
      <Separator className="my-6" />
      
      <p className="text-sm text-gray-500 mt-8">
        This page is intended for administrator use only. Unauthorized access is prohibited.
      </p>
    </div>
  );
} 